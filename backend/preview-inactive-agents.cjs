require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI ||
      process.env.MONGODB_URI
    );

    const db = mongoose.connection.db;

    const agents = await db
      .collection("users")
      .find({
        role: "agent",
        status: { $ne: "active" }
      })
      .project({
        phone: 1,
        name: 1,
        status: 1,
        referralCode: 1
      })
      .toArray();

    console.log(
      "\nINACTIVE AGENTS:",
      agents.length
    );

    console.table(
      agents.map((agent) => ({
        id: String(agent._id),
        name: agent.name || "",
        phone: agent.phone || "",
        status: agent.status,
        referralCode:
          agent.referralCode || ""
      }))
    );

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
})();
