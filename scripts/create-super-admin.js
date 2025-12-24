const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function createSuperAdmin() {
  const client = await pool.connect();

  try {
    // Check if super admin already exists
    const existingAdmin = await client.query(
      "SELECT id FROM users WHERE user_role = $1",
      ["SUPER_ADMIN"],
    );

    if (existingAdmin.rows.length > 0) {
      console.log("Super admin already exists!");
      return;
    }

    // Create super admin user
    const username = "admin";
    const email = "admin@vetlink.com";
    const password = "admin123"; // Change this in production!
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await client.query(
      `INSERT INTO users (username, email, password_hash, user_role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, username, email, user_role`,
      [username, email, passwordHash, "SUPER_ADMIN"],
    );

    const newAdmin = result.rows[0];

    console.log("Super admin created successfully!");
    console.log("Username:", newAdmin.username);
    console.log("Email:", newAdmin.email);
    console.log("Role:", newAdmin.user_role);
    console.log("Password:", password);
    console.log("\n⚠️  IMPORTANT: Change the password after first login!");
  } catch (error) {
    console.error("Error creating super admin:", error);
  } finally {
    client.release();
  }
}

// Run the script
createSuperAdmin()
  .then(() => {
    console.log("Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
