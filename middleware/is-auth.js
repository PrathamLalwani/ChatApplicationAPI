const isAuth = async (req, res) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    res.status(401).send("User is NOT Authenticated");
    return;
  }
  const token = authHeader.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, secret);
  } catch (error) {
    console.log(error);
  }
  if (!decodedToken) {
    res.status(401).send("User is NOT Authenticated");
    return;
  }
  req.username = decodedToken.username;
  next();
};

export default isAuth;
