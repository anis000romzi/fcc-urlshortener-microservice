require('dotenv').config();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const express = require('express');
const shortid = require('shortid');
const cors = require('cors');
const dns = require('dns');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const shortUrlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});

const ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  dns.lookup(new URL(req.body.url).hostname, { all: true }, async (error, addresses) => {
    if (!error) {
      try {
        const data = await ShortUrl.findOne({ original_url: req.body.url })
        if (data) {
          res.json({
            original_url: data.original_url,
            short_url: data.short_url,
          })
        } else {
          const dataCreate = await ShortUrl.create({
            original_url: req.body.url,
            short_url: shortid.generate(),
          });
          res.json({
            original_url: dataCreate.original_url,
            short_url: dataCreate.short_url,
          })
        }
      } catch (error) {
        res.json({  error: 'Server error' })
      }
    } else {
      res.json({ error: 'invalid url' })
    }
  });
})

app.get('/api/shorturl/:short_url', async (req, res) => {
  try {
    const data = await ShortUrl.findOne({ short_url: req.params.short_url });
    if (data) {
      res.redirect(data.original_url);
    } else {
      res.json({ error: 'URL not found'});
    }
  } catch (error) {
    res.json({ error: 'Server error' })
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
