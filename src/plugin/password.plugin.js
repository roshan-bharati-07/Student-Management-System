import bcrypt from "bcrypt";

export async function passwordPlugin(schema) {
  schema.pre("save", async function (next) {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    next();
  });

  // Compare password method
  schema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };
}
