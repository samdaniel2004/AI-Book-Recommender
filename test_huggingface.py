from huggingface_hub import whoami

user = whoami()

print("Hugging Face connected!")
print("Username:", user["name"])