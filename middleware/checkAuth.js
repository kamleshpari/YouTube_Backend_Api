const jwt=require('jsonwebtoken');

module.exports= async(req,res,next)=>{
 try {
    
   const token = req.headers.authorization.split(" ")[1];
    await jwt.verify(token, process.env.JWT_SECRET_KEY);
   next();

 } catch (error) {
    console.error('Error in checkAuth middleware:', error);
    return res.status(401).json({ message: 'Invalid Token' });

 }
}