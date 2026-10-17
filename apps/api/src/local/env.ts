// ใช้เฉพาะตอนรันบนเครื่อง ห้าม import จาก handler
// ถ้าตั้ง TARGET=aws จะไม่ตั้ง endpoint ของ DynamoDB Local (ใช้ DynamoDB จริงด้วย credentials ใน ~/.aws)
if (process.env.TARGET !== "aws") {
  process.env.DYNAMODB_ENDPOINT ??= "http://localhost:8000";
  process.env.AWS_REGION ??= "us-east-1";
  process.env.AWS_ACCESS_KEY_ID ??= "local";
  process.env.AWS_SECRET_ACCESS_KEY ??= "local";
}