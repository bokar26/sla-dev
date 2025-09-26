from cryptography.fernet import Fernet
import base64
import os

def get_encryption_key():
    """Get or create encryption key"""
    key = os.getenv("ENCRYPTION_KEY")
    if not key:
        # Generate a new key for development
        key = Fernet.generate_key().decode()
        print(f"Generated new encryption key: {key}")
        print("Add this to your .env file as ENCRYPTION_KEY")
    else:
        # Ensure key is properly formatted
        if len(key) != 44:  # Fernet keys are 44 characters
            raise ValueError("ENCRYPTION_KEY must be 44 characters long")
        key = key.encode()
    
    return key

def encrypt_data(data: str) -> str:
    """Encrypt sensitive data"""
    if not data:
        return data
    
    key = get_encryption_key()
    f = Fernet(key)
    encrypted_data = f.encrypt(data.encode())
    return base64.b64encode(encrypted_data).decode()

def decrypt_data(encrypted_data: str) -> str:
    """Decrypt sensitive data"""
    if not encrypted_data:
        return encrypted_data
    
    key = get_encryption_key()
    f = Fernet(key)
    decoded_data = base64.b64decode(encrypted_data.encode())
    decrypted_data = f.decrypt(decoded_data)
    return decrypted_data.decode()
