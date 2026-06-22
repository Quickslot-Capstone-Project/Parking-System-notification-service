const { DeleteMessageCommand, ReceiveMessageCommand, SQSClient } = require("@aws-sdk/client-sqs");
const { createNotification } = require("../models/Notification");

const client = new SQSClient({ region: process.env.AWS_REGION || "us-east-1" });
let running = false;

const handleMessage = async (message) => {
  const event = JSON.parse(message.Body);
  if (event.eventType !== "notification.requested" || !event.payload) {
    throw new Error("Unsupported or incomplete notification event");
  }
  try {
    await createNotification({
      ...event.payload,
      notificationId: `NTF-${event.eventId}`,
      sourceEventId: event.eventId,
    });
  } catch (error) {
    if (error.name !== "ConditionalCheckFailedException") {
      throw error;
    }
    console.log(`Duplicate notification event ignored: ${event.eventId}`);
  }
};

const startNotificationQueueConsumer = () => {
  const queueUrl = process.env.NOTIFICATION_QUEUE_URL;
  if (String(process.env.SQS_ENABLED).toLowerCase() !== "true" || !queueUrl || running) {
    return;
  }
  running = true;
  console.log("Notification SQS consumer started");

  const poll = async () => {
    while (running) {
      try {
        const response = await client.send(new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20,
          VisibilityTimeout: 120,
        }));
        for (const message of response.Messages || []) {
          try {
            await handleMessage(message);
            await client.send(new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: message.ReceiptHandle }));
          } catch (error) {
            console.error("Notification SQS message failed", error.message);
          }
        }
      } catch (error) {
        console.error("Notification SQS polling failed", error.message);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  };
  poll();
};

module.exports = { startNotificationQueueConsumer };

