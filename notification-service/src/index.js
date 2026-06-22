require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const notificationRoutes = require("./routes/notificationRoutes");
const { startNotificationQueueConsumer } = require("./services/notificationQueueConsumer");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());
app.use(morgan("dev"));
app.use("/", notificationRoutes);

const start = async () => {
  try {
    const port = process.env.PORT || 4006;
    app.listen(port, () => {
      console.log(`Notification service listening on port ${port}`);
    });
    startNotificationQueueConsumer();
  } catch (error) {
    console.error("Notification service failed to start", error);
    process.exit(1);
  }
};

start();
