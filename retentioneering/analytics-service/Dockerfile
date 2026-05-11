# Use a slim version of Python for a smaller production image
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies needed for libraries like Retentioneering
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies (replaces your local venv)
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your analytics code and the Firebase key
COPY . .

# Expose the port FastAPI runs on
EXPOSE 8080

# Command to run the listener in production mode
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]