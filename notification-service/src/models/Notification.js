const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const tableName = process.env.NOTIFICATION_TABLE || "smart-parking-notifications";
const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" }),
  { marshallOptions: { removeUndefinedValues: true } }
);

const buildNotificationId = () => `NTF-${Date.now()}${Math.floor(Math.random() * 10000)}`;

const scanAll = async () => {
  const items = [];
  let ExclusiveStartKey;

  do {
    const response = await client.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey,
      })
    );
    items.push(...(response.Items || []));
    ExclusiveStartKey = response.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
};

const sortNewest = (items) =>
  [...items].sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));

const createNotification = async (notification) => {
  const now = new Date().toISOString();
  const item = {
    notificationId: notification.notificationId || buildNotificationId(),
    ...notification,
    createdAt: now,
    updatedAt: now,
  };

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression: "attribute_not_exists(notificationId)",
    })
  );

  return { ...item, _id: item.notificationId };
};

const listNotifications = async ({ recipientUserId, isAdmin }) => {
  const notifications = await scanAll();
  return sortNewest(
    isAdmin ? notifications : notifications.filter((notification) => notification.recipientUserId === recipientUserId)
  )
    .slice(0, 100)
    .map((notification) => ({ ...notification, _id: notification.notificationId }));
};

module.exports = { createNotification, listNotifications };
