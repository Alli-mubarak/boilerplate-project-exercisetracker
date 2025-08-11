const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config();


    const mongoose = require('mongoose');
   mongoose.connect(process.env.MONGO_URI, {
       useNewUrlParser: true,
       useUnifiedTopology: true,
   })
   .then(() => {
       console.log('Mongoose connected to MongoDB Atlas');
   })
   .catch((err) => {
       throw ('Mongoose connection error:', err);
       
  });




app.use(cors())
app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));

app.use( function middleware(req, res, next){
    console.log(req.method + " "+req.path+" - "+ req.ip);
    next();
})
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



//using mongoose to create a user schema
const userSchema = new mongoose.Schema({
  username: String,
  exercises:[
    {
      description: String,
      duration: Number,
      date: String
}]
});
const User = mongoose.model("User", userSchema);

app.post("/api/users",(req, res,next)=>{
  const user = req.body.username;
  if(!user){
    return res.status(400).json({error: "Username is required!"});
  }
   const newUser = new User({
    username: user
  });
  newUser.save((err, data)=>{
    if(err) return console.error(err);
    console.log(newUser.username, "has been saved to the database");
  });

  res.json({username: user, _id: newUser._id});
})

app.get('/api/users', (req, res)=>{
  User.find({}).select({exercises:0, log:0}).exec( (err, users)=>{
    if(err) return console.error(err);
    res.json(users);
  })
})

// app.post('/api/users/:_id/exercises', (req, res)=>{
//   const userId = req.params._id;
//   let {description, duration, date} = req.body;
//   setTimeout(()=>{
//   if(!date){
//     date = new Date().toDateString();
//   }
//   if(!userId){
//     return res.status(400).json({error: 'User ID is required!'});
//   }
//   User.findById(userId,(err, user)=>{
//     if(err) {
//       res.json({error: 'cannot fetch user!'});
//       return console.error(err);}
//     user.exercises.push({
//       description:description,
//       duration:duration,
//       date:date
//     })
//     user.save((err, updatedUser)=>{
//       if(err) return console.error(err);
// console.log(updatedUser);
    
//   res.json({
//     _id: userId,
//     username: user.username,
//     date: date,
//     duration: duration,
//     description: description
//   });
// console.log(description,' execise added to ', user.username);
//   })
//   })
//   },1000);
// })

app.post('/api/users/:_id/exercises', (req, res)=>{
  const userId = req.params._id;
  let {description, duration, date} = req.body;
setTimeout(() => {
  
  if(!date){
    date = new Date().toDateString();
  }
  if(!userId){
    return res.status(400).json({error: 'User ID is required!'});
  }
  User.findByIdAndUpdate(userId,
    {$push: {exercises:{
      description: description,
      duration: duration,
      date: date
    }}},{new: true}, (err, updatedUser)=>{
      if(err) return console.error(err);
      let newExercise = updatedUser.exercises[updatedUser.exercises.length - 1];
     res.json({
      username: updatedUser.username,
    _id: userId,
    description: newExercise.description,
    duration: newExercise.duration,
    date: newExercise.date
  });
      console.log(updatedUser. username, "added an exercise", updatedUser.exercises);
    }
  )
  }, 500);
})

app.get('/api/users/:_id/logs', (req, res)=>{
  const userId = req.params._id;
  const {from, to, limit} = req.query;
  if(!userId){
    return res.status(400).json({error: 'User ID is required!'});
  }
  User.findById(userId, (err, user)=>{
    if(err) return console.error(err);
    if(!user){
      return res.status(404).json({error: 'User not found!'});
    }
    let exercises = user.exercises;
    if(!limit){
    res.json({
      username: user.username,
      _id : userId,
      count: exercises.length,
      log: exercises.filter((exercise)=>{
        let exerciseDate = new Date(exercise.date);
        if(from && to){
          console.log('from and to used');
          return exerciseDate >= new Date(from) && exerciseDate <= new Date(to);
        }else if(from){
          console.log('from used');
          return exerciseDate >= new Date(from);
        }else if(to){
          console.log('to used');
          return exerciseDate <= new Date(to);
        }else{
          return true;
        }
      })
    });}else{
       res.json({
      username: user.username,
      _id : userId,
      count: exercises.length,
      log: exercises.slice(0, limit)
    });
    console.log('limit is used');
    }
    console.log("showing logs for ", user.username, from, to, limit);
  })

})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
