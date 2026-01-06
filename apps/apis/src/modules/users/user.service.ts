import { db } from "../../db";
import { users } from "../../db/schema/users.schema";

interface CreateUserInput {
  username: string;
  email: string;
  password: string;
}

export async function createUserTx(
  tx: typeof db,
  data: CreateUserInput
) {
  const [user] = await tx
    .insert(users)
    .values({
      username: data.username,
      email: data.email,
      password: data.password, 
    })
    .returning();

  return user;
}
