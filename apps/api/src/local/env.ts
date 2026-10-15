// ใช้เฉพาะตอนพัฒนาบนเครื่อง ห้าม import จาก handler
process.env.DYNAMODB_ENDPOINT ??= "http://localhost:8000";
process.env.AWS_REGION ??= "us-east-1";
process.env.AWS_ACCESS_KEY_ID ??= "local";
process.env.AWS_SECRET_ACCESS_KEY ??= "local";