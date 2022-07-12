const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from:'termine92@gmail.com',
        subject:'Thanks for joining in!',
        text:`Welcome to the app, ${name}. Let me know how you get along with the app.`

    })
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from:'termine92@gmail.com',
        subject:'Delete Confimed',
        html:`<p>Hi ${name}.</p> <br> <p>Your account has been remove from out database along with your ${email}.</p> `

    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}