const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const {sendWelcomeEmail, sendCancelationEmail} = require('../emails/account')
const router = new express.Router()

// handle errors
const handleErrors = (err) => {
    console.log(err.message, err.code);
    let errors = { email: '', password: '' };
  
    // incorrect email
    if (err.message === 'incorrect email') {
      errors.email = 'That email is not registered';
    }
  
    // incorrect password
    if (err.message === 'incorrect password') {
      errors.password = 'That password is incorrect';
    }
  
    // duplicate email error
    if (err.code === 11000) {
      errors.email = 'that email is already registered';
      return errors;
    }
  
    // validation errors
    if (err.message.includes('user validation failed')) {
      // console.log(err);
      Object.values(err.errors).forEach(({ properties }) => {
        // console.log(val);
        // console.log(properties);
        errors[properties.path] = properties.message;
      });
    }
  
    return errors;
  }

// Save a new user
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.cookie('jwt', token, {
            httpOnly: false,
            sameSite: "Lax",
            maxAge: 1000 * 60 * 60 * 24,
            secure: false });
        res.status(201).json({ user, token })
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
})

//authenticate a new user and send back a jwt cookie
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.cookie('jwt', token, {
            httpOnly: false,
            sameSite: "Lax",
            maxAge: 1000 * 60 * 60 * 24,
            secure: false });
        res.status(200).json({ user, token })


    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
        console.log(errors);
    }
})

//logout a user from a Client (React) it does not work on broswer only.
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.status(200).json()
    } catch (e) {
        res.status(500).json()
    }
})

//logout a user from multiple devices
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.json()
    } catch (e) {
        res.status(500).json()
    }
})

//read user profile
router.get('/users/me', auth, async (req, res) => {
    res.json(req.user)
})

//update profile
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).json({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.json(req.user)
    } catch (e) {
        res.status(400).json(e)
    }
})

//delete profile and send email
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendCancelationEmail(req.user.email, req.user.name)
        res.json(req.user)
    } catch (e) {
        res.status(500).json()
    }
})

//update image and create a folder
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})

//upload an avatar image and buffer into the database
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    
    req.user.avatar = buffer
    await req.user.save()
    res.json()
}, (error, req, res, next) => {
    res.status(400).json({ error: error.message })
})

//delete a buffer image
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.json()
})

//get avatar per ID
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.json(user.avatar)
    } catch (e) {
        res.status(404).json()
    }
})


module.exports = router