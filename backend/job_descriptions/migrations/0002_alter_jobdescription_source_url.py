from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('job_descriptions', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='jobdescription',
            name='source_url',
            field=models.URLField(blank=True, max_length=1000),
        ),
    ]

