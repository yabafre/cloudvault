import os
import boto3
from PIL import Image
import io

s3_client = boto3.client('s3')

def lambda_handler(event, context):
    """
    Déclenché par S3 ObjectCreated.
    Génère un thumbnail et le sauvegarde dans le même bucket sous thumbnails/
    """
    try:
        # Récupère les infos du fichier uploadé
        bucket = event['Records'][0]['s3']['bucket']['name']
        key = event['Records'][0]['s3']['object']['key']
        
        # Skip si c'est déjà un thumbnail
        if key.startswith('thumbnails/'):
            return {'statusCode': 200, 'body': 'Thumbnail skipped'}
        
        # Télécharge l'image
        response = s3_client.get_object(Bucket=bucket, Key=key)
        image_data = response['Body'].read()
        
        # Génère le thumbnail (max 200x200)
        image = Image.open(io.BytesIO(image_data))
        image.thumbnail((200, 200))
        
        # Sauvegarde en mémoire
        buffer = io.BytesIO()
        image.save(buffer, format=image.format or 'JPEG')
        buffer.seek(0)
        
        # Upload le thumbnail
        thumbnail_key = f"thumbnails/{key}"
        s3_client.put_object(
            Bucket=bucket,
            Key=thumbnail_key,
            Body=buffer,
            ContentType=response['ContentType']
        )
        
        return {
            'statusCode': 200,
            'body': f'Thumbnail créé: {thumbnail_key}'
        }
        
    except Exception as e:
        print(f"Erreur: {str(e)}")
        return {'statusCode': 500, 'body': str(e)}
