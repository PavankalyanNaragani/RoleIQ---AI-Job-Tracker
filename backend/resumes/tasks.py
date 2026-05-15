import io
import logging
import PyPDF2
from celery import shared_task
from django.utils import timezone
from django.conf import settings

logger = logging.getLogger('resumes')


def extract_text_from_local_pdf(file_path):
    """Read PDF from local filesystem and extract text."""
    full_path = settings.MEDIA_ROOT / str(file_path)
    with open(full_path, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        text = '\n'.join(page.extract_text() or '' for page in reader.pages)
    return text.strip()


def chunk_text(text, chunk_size=400, overlap=50):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        if chunk:
            chunks.append(chunk)
    return chunks


def embed_resume_in_chromadb(resume):
    """Store resume text chunks in local ChromaDB."""
    import chromadb
    from chromadb.utils import embedding_functions

    client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name='BAAI/bge-small-en-v1.5'
    )
    collection_name = f'resume_u{resume.user_id}_r{resume.id}'
    collection = client.get_or_create_collection(name=collection_name, embedding_function=ef)

    chunks = chunk_text(resume.raw_text)
    if not chunks:
        return

    collection.add(
        documents=chunks,
        ids=[f'chunk_{resume.id}_{i}' for i in range(len(chunks))],
        metadatas=[{'resume_id': str(resume.id), 'chunk_index': i} for i in range(len(chunks))],
    )
    logger.info(f'ChromaDB: embedded {len(chunks)} chunks for resume {resume.id}')


@shared_task(bind=True, max_retries=3)
def process_resume_task(self, resume_id):
    """Extract text → embed in ChromaDB → trigger analysis agent (added in Feature 6)."""
    from resumes.models import Resume
    try:
        resume = Resume.objects.get(id=resume_id)
        resume.parse_status = 'PROCESSING'
        resume.save(update_fields=['parse_status'])

        # Extract text from local file
        text = extract_text_from_local_pdf(resume.file.name)
        if not text:
            raise ValueError('PDF text extraction returned empty. Is this a scanned PDF?')

        resume.raw_text = text
        resume.save(update_fields=['raw_text'])

        # Embed in local ChromaDB.
        # In restricted/offline environments, embedding model downloads can fail.
        # We still mark resume parsing as DONE so the core app flow continues.
        embedded_at = None
        try:
            embed_resume_in_chromadb(resume)
            embedded_at = timezone.now()
        except Exception as embed_exc:
            logger.warning(
                f'Embedding skipped for resume {resume.id}: {embed_exc}'
            )

        resume.embedded_at = embedded_at
        resume.parse_status = 'DONE'
        resume.save(update_fields=['embedded_at', 'parse_status'])

        # Trigger analyzer (safe — skipped if agent not built yet)
        try:
            from ai_engine.tasks import analyze_resume_task
            analyze_resume_task.delay(resume_id)
        except ImportError:
            pass

        logger.info(f'Resume processed successfully: {resume_id}')

    except Exception as exc:
        from resumes.models import Resume as R
        R.objects.filter(id=resume_id).update(parse_status='FAILED')
        logger.error(f'Resume processing failed [{resume_id}]: {exc}')
        raise self.retry(exc=exc, countdown=30)
