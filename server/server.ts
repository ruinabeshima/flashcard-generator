import dotenv from "dotenv";
dotenv.config();
import createApp from "./app";

const port = process.env.PORT || 8080;

createApp()
  .then((app) => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
