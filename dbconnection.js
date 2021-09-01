const MongoClient = require('mongodb').MongoClient
const connectionString =  'mongodb+srv://xuejie:xuejieguo97@cluster0.jymjx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
const connect = MongoClient.connect(connectionString, { useUnifiedTopology: true })
module.exports = connect