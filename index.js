const express = require('express')
const app = express()
const port = 2900
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const cors = require('cors');
app.use(express.json())

app.use(cors());

///connect to Mondodb
const { MongoClient, ServerApiVersion, Admin } = require('mongodb');
const uri = "mongodb+srv://SyazwinaFarah:jMouzjGE8pLUluRl@cluster0.zweklwf.mongodb.net/";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("ApartmentVisitorManagement").command({ ping: 1 });
    console.log("MongoDB is connected");
  } finally {}
    // Ensures that the client will close when you finish/error
    // await client.close();
  
}
run().catch(console.dir);

//collection
const db = client.db("ApartmentVisitorManagement");
const Visitorregistration = db.collection('Visitor');
const adminuser = db.collection('Admin');
const collectionuser = db.collection('User');
const passesCollection = db.collection('Passes');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Apartment-VMS',
        version: '1.0.0',
        description: 'Apartment Visitor Management System',
      },
    },
    apis: ['Apartmentt.js'], // Ensure this path is correct
  };
  
  const swaggerDocs = swaggerJsdoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  

function generateToken(adminData) {
  try {
    const token = jwt.sign(
      adminData,
      'adminuser', // Replace with a strong, secret key
      { expiresIn: '1h' }
    );
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
}

// Middleware to verify the token and set user information in req.user
function verifyToken(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ message: 'Unauthorized: Token missing' });
    }

    const token = header.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token format' });
    }

    jwt.verify(token, 'adminuser', function (err, decoded) {
      if (err) {
        console.error('Error verifying token:', err);
        return res.status(403).json({ message: 'Forbidden: Invalid token' });
      }

      req.user = decoded; // Set user information in the request
      next();
    });
  } catch (error) {
    console.error('Error during token verification:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

module.exports = { generateToken, verifyToken };

//post to register admin,
app.post('/registeradmin', (req, res) => {
  let Admin = {
    username: req.body.username,
    password: req.body.password,
    role: req.body.role
  }; 

  adminuser.insertOne(Admin, (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    console.log('Admin registered:', result.insertedId);
    res.send('Admin registered successfully!');
  })
  console.log('Admin registered');
  res.send('Admin registered successfully!');
});

  //to login admin..
app.post('/AdminLogin', async (req, res) => {
    const { username, password } = req.body;
    const user = await adminuser.findOne({ username,password });
    if (user) 
    {
      let token = generateToken(user)
      res.send({ Status: "Login Succesful!", token: token });
    }
    else
    {
      res.send("Invalid username or password")
    }
 });


  app.post('/registerUser', (req, res) => {
    let User = {
      username: req.body.username,
      password: req.body.password,
      role: req.body.role
    }; 
  
    collectionuser.insertOne(User, (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
  
      console.log('User registered');
      res.send('User registered successfully!');
    })
    console.log('User registered');
    res.send('User registered successfully!');
    });


    //to login security..
app.post('/loginUser', async (req, res) => {
    const { username, password } = req.body;
    
    const user = await collectionuser.findOne({ username,password });
    if (user) 
    {
      let token = generateToken(user)
      res.send({ Status: "Login Succesful!", token: token });
      //res.send("Login Succesful!")

    }

    else {
      res.send("Invalid username or password")
    }
  });


  //to register a visitor into mongodb only admin
app.post('/registervisitor', verifyToken, (req, res) => {
  if (req.user.role == 'admin') {
    return res.status(403).send('Forbidden: Insufficient privileges');
  }

else {
    let visitor = {
      Name: req.body.Name,
      Phone_Number: req.body.Phone_Number,
      Address: req.body.Address,
      Floor_Wing: req.body.Floor_Wing,
      Whom_to_meet: req.body.Whom_to_meet,
      Reason_to_meet: req.body.Reason_to_meet
    }; 
   
    Visitorregistration.insertOne(visitor, (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        res.status(500).send('Internal Server Error');
      }
      else{
      console.log('Visitor registered:', result.insertedId);
      }
      

    });
    res.send('Visitor registered successfully!');
  }});
  

app.get('/viewvisitor', verifyToken, (req, res) => 
  {
    Visitorregistration.find().toArray()
      .then(Visitor => {
        res.json(Visitor);
      })
      .catch(error => {
        console.error('Error retrieving visitor information:', error);
        res.status(500).send('An error occurred while retrieving visitor information');
      });
    });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })


app.get('/viewuser', verifyToken, (req, res) => 
  {
    if (req.user.role == 'user') {
      return res.status(403).send('Forbidden: Insufficient privileges');
    }
    collectionuser.find().toArray()
      .then(User => {
        res.json(User);
      })
      .catch(error => {
        console.error('Error retrieving User information:', error);
        res.status(500).send('An error occurred while retrieving User information');
      });
    });


app.put('/users/:id', verifyToken, (req, res) => {
  if (req.user.role == 'admin') {
    return res.status(403).send('Forbidden: Insufficient privileges');
  }

  const userId = req.params.id;
  const visitor = req.body;

  Visitorregistration.updateOne({ _id: new ObjectId(userId) }, { $set: visitor })
   {
    res.send('Visitor updated successfully');
    //client.close();
  }
});

// Delete a visitor (admin only)
app.delete('/DeleteVisitor/:id', verifyToken, (req, res) => {
  if (req.user.role == 'admin') {
    return res.status(403).send('Forbidden: Insufficient privileges');
  }

  const userId = req.params.id;

  Visitorregistration
    .deleteOne({ _id: new ObjectId(userId) })
    .then(() => {
      res.send('Visitor data deleted successfully');
    })
    .catch((error) => {
      console.error('Error deleting visit detail:', error);
      res.status(500).send('An error occurred while deleting the visit detail');
    });
});


// User issues visitor pass
app.post('/issuePass', verifyToken, (req, res) => {

 // if (req.user.role == 'admin') {
 //   return res.status(403).send('Forbidden: Insufficient privileges');
 // }

  const { visitorName, passType } = req.body;

  Visitorregistration.findOne({ Name: visitorName })
    .then(visitor => {
      if (!visitor) {
        return res.status(404).send('Visitor not found');
      }

  const passDetails = {
    visitorId: visitor.Name, // Use the visitor's name as the identifier
    passType: passType,
    issuedBy: req.user.username,
    issueDate: new Date(),
  };

 // Save passDetails to the Passes collection
 passesCollection.insertOne(passDetails)
 .then(result => {
   console.log('Pass issued:', result.insertedId);
   res.send('Visitor pass issued successfully!');
 })
 .catch(error => {
   console.error('Error issuing visitor pass:', error);
   res.status(500).send('An error occurred while issuing visitor pass');
 });
})
.catch(error => {
console.error('Error finding visitor:', error);
res.status(500).send('An error occurred while finding the visitor');
});
});

// Visitor retrieves their pass
app.get('/retrievePass/:visitorName', (req, res) => {
  const visitorName = req.params.visitorName;

  // Assuming you have a way to identify the visitor, for example, by their ID
  passesCollection.findOne({ visitorId: visitorName })
    .then(passDetails => {
      if (passDetails) {
        res.json(passDetails);
      } else {
        res.status(404).send('Visitor pass not found');
      }
    })
    .catch(error => {
      console.error('Error retrieving visitor pass:', error);
      res.status(500).send('An error occurred while retrieving visitor pass');
    });
});



