const express = require('express')
const soap = require('soap')
const bodyParser = require('body-parser')
require('body-parser-xml')(bodyParser)

const app = express()
const port = process.env.PORT || 8143

const logg = (text, value) => {
    console.log(`${new Date().toLocaleString()} - ${text}`, value ?? '')
}

app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.xml({
    limit: '5MB'
}))

app.post('/biomid/:url', bodyParser.xml(), async function (req, res) {
    const soapUrl = `http://www.dneonline.com/calculator.asmx?WSDL` // req.params.url
    let args = {}

    try {
        args = {
            intA: Number(req.body['soapenv:Envelope']['soapenv:Body'][0]['tns:Add'][0]['tns:intA'][0]),
            intB: Number(req.body['soapenv:Envelope']['soapenv:Body'][0]['tns:Add'][0]['tns:intB'][0])
        }
    } catch (err) {
        logg('Error receiving params: ', err)
        return res.send({ message: 'Error receiving params', err })
    }

    try {
        soap.createClient(soapUrl, function (err, client) {
            if (err) {
                logg('Error creating client: ', err)
                res.send({ message: 'Error creating client', err })
            } else {
                logg('Send a request Add..', args)
                client.Add(args, function (err, result, rawResponse, soapHeader, rawRequest) {
                    if (err) {
                        logg('Error on request: ', err)
                        res.send({ message: 'Error on request', err })
                    } else {
                        logg('Response: ', result)
                        res.send(rawResponse.replace(/[^(\x00-\x7F)(à-úÀ-Ú)]/g, ""))
                    }
                })
            }
        })

    } catch (err) {
        log('Error: ', err)
        res.send({ message: 'Error', err })
    }
})

app.listen(port)
console.log('BIOMID started at http://localhost:' + port)


//teste encode
// <?xml version="1.0" encoding="utf-±8"?>
// <soap:Envelope
// 	xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
// 	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
// 	xmlns:xsd="http://www.w3.org/2001/XMLSchema">
// 	<soap:Body>
// 		<AddResponse°
// 			xmlns="http://tempuri.org/">
// 			<AddResult>Hidd©©©en??As––--[21]
//                            –cii ¡©©®®®¢Ch£arac££ter
//                           ¤ –cii ¡©©®®®Charac££ter
//                        Cristália AssociaçãÇo de dasd âãáé*&@!
// qwertyuiop´[asdfghjklç~]záéàèèéãâóxcvbnm,.;WERTYUIOP`{ASDFGHJKLÇ^}:ZXCVBNM<>:|\qw´wqe´r´trétreýú´tyiýoýk´hjk´´h´´gsg´fdás´dczx´v´bcvnbnvb~vm~´bn~,~gv~~bn~m´hñ´cv~b´sfd~´as~f´~s´v~b´~</AddResult>
// [^\w ^\x00-\x7F]®
// [^\x00-\x7F]+
// [^\u0000-\u007F]+
// [\u00BF-\u1FFF\u2C00-\uD7FF\w]
// 		</AddResponse>
// 	</soap:Body>
// </soap:Envelope>