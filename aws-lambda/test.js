import { handler } from "./createUser.js";

handler({ hello: "world" }).then((data) => {
  console.log(data);
});
