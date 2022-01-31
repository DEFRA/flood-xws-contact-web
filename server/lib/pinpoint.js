const AWS = require('aws-sdk')
const { pinpointApplicationId, pinpointFromAddress } = require('../config')
const pinpoint = new AWS.Pinpoint()

async function sendEmailToken (destinationEmail, token) {
  const params = {
    ApplicationId: pinpointApplicationId,
    MessageRequest: {
      Addresses: {
        [destinationEmail]: { ChannelType: 'EMAIL' }
      },
      MessageConfiguration: {
        // DefaultMessage: {
        //   Substitutions: {
        //     code: [token]
        //   }
        // },
        EmailMessage: {
          FromAddress: pinpointFromAddress,
          Substitutions: {
            code: [token]
          }
          // ,
          // SimpleEmail: {
          //   Subject: {
          //     Charset: charset,
          //     Data: 'Get Flood Warnings Verification Token'
          //   },
          //   HtmlPart: {
          //     Charset: charset,
          //     Data: `
          //     <html>
          //       <body>
          //         <h1>Get Flood Warnings</h1>
          //         <p>${body}</p>
          //       </body>
          //     </html>`
          //   },
          //   TextPart: {
          //     Charset: charset,
          //     Data: `
          //       Get Flood Warnings
          //       ------------------
          //       ${body}
          //     `
          //   }
          // }
        }
      },
      TemplateConfiguration: {
        EmailTemplate: {
          Name: 'public-verification-email'
        }
      }
    }
  }

  console.log(params)
  return pinpoint.sendMessages(params).promise()
}

/**
 * Send an OTP via SMS
 *
 * @param {string} phoneNumber - The parsed and validated phone number
 * @param {string} token - The time-based one-time password (TOTP)
 */
async function sendSMSToken (phoneNumber, token) {
  const params = {
    ApplicationId: pinpointApplicationId,
    MessageRequest: {
      Addresses: {
        [phoneNumber]: { ChannelType: 'SMS' }
      },
      MessageConfiguration: {
        // DefaultMessage: {
        //   Substitutions: {
        //     headline: [headline],
        //     body: [body]
        //   }
        // },
        // EmailMessage: {
        //   FromAddress: fromAddress,
        //   // Substitutions: {
        //   //   headline: [headline],
        //   //   body: [body]
        //   // }
        //   // SimpleEmail: {
        //   //   Subject: {
        //   //     Charset: charset,
        //   //     Data: 'Get Flood Warnings Verification Token'
        //   //   },
        //   //   HtmlPart: {
        //   //     Charset: charset,
        //   //     Data: `
        //   //     <html>
        //   //       <body>
        //   //         <h1>Get Flood Warnings</h1>
        //   //         <p>${body}</p>
        //   //       </body>
        //   //     </html>`
        //   //   },
        //   //   TextPart: {
        //   //     Charset: charset,
        //   //     Data: `
        //   //       Get Flood Warnings
        //   //       ------------------
        //   //       ${body}
        //   //     `
        //   //   }
        //   // }
        // },
        SMSMessage: {
          MessageType: 'TRANSACTIONAL',
          Substitutions: {
            code: [token]
          }
        }
        // VoiceMessage: {
        //   Body: body
        // }
      },
      TemplateConfiguration: {
        // EmailTemplate: {
        //   Name: 'public-verification-sms'
        // },
        SMSTemplate: {
          Name: 'public-verification-sms'
        }
        // VoiceTemplate: {
        //   Name: 'STRING_VALUE',
        //   Version: 'STRING_VALUE'
        // }
      }
    }
  }

  return pinpoint.sendMessages(params).promise()
}

module.exports = { sendEmailToken, sendSMSToken }
