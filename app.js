const moment = require('moment');
const builder = require('botbuilder');
const restify = require('restify');
const server = restify.createServer();

// Setup bot
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
const bot = new builder.UniversalBot(connector);

// Setup LUIS
const recognizer = new builder.LuisRecognizer('https://api.projectoxford.ai/luis/v1/application?id=26f79385-d6b4-49ec-b4e3-24b62c000eea&subscription-key=e5c674fb69ac4e9a876ffdc2b3f94cff');
const intents = new builder.IntentDialog({ recognizers: [recognizer] });

// Setup Intents
intents.matches('Saludar', function (session, results) {
    session.send('Hola ¿En que te puedo ayudar?');
});

intents.matches('Pedir', [function (session, args, next) {
    const pizzas = ['Carbonara', 'Barbacoa', 'Margarita', 'Especialidad'];
    const entityPizza = builder.EntityRecognizer.findEntity(args.entities, 'Pizza');

    if (entityPizza) {
        const match = builder.EntityRecognizer.findBestMatch(pizzas, entityPizza.entity);
    }

    if (!match) {
        builder.Prompts.choice(session, 'Ahora mismo tenemos estas pizzas disponibles, ¿Cual te gustaría probar?', pizzas);
    } else {
        next({ response: match });
    }
}, function (session, results) {
    if (results.response) {
        const time = moment().add(30, 'm');

        session.dialogData.time = time.format('HH:mm');
        session.send("De acuerdo, tu pizza %s llegará a las %s.", results.response.entity, session.dialogData.time);
    } else {
        session.send('De acuerdo, si no te gustan, intenta la próxima vez :)');
    }
}]);

intents.matches('Cancelar', function (session, results) {
    session.send('Pedido cancelado correctamente. ¡Vuelva pronto!');
});

intents.matches('Comprobar', function (session, results) {
    session.send('Tu pizza llegará a las %s', session.dialogData.time);
});

intents.onDefault(builder.DialogAction.send('No he entendido lo que quieres decir'));

bot.dialog('/', intents);

// Setup Restify Server
server.post('/api/messages', connector.listen());

server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s escuchando %s', server.name, server.url);
});