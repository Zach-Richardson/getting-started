'use strict';

const BotAtlasClient = require('./atlas_client');
const cache = require('./cache');
const relay = require('librelay');


class ForstaBot {

    async start() {
        const ourId = await relay.storage.getState('addr');
        if (!ourId) {
            return;
        }
        this.atlas = await BotAtlasClient.factory();
        this.getUsers = cache.ttl(60, this.atlas.getUsers.bind(this.atlas));
        this.resolveTags = cache.ttl(60, this.atlas.resolveTags.bind(this.atlas));
        this.msgReceiver = await relay.MessageReceiver.factory();
        this.msgReceiver.addEventListener('keychange', this.onKeyChange.bind(this));
        this.msgReceiver.addEventListener('message', ev => this.onMessage(ev), null);
        this.msgReceiver.addEventListener('error', this.onError.bind(this));

        this.msgSender = await relay.MessageSender.factory();

        await this.msgReceiver.connect();
    }

    stop() {
        if (this.msgReceiver) {
            this.msgReceiver.close();
            this.msgReceiver = null;
        }
    }

    async restart() {
        this.stop();
        await this.start();
    }

    async onKeyChange(ev) {
        await ev.accept();
    }

    onError(e) {
        console.error('Message Error', e, e.stack);
    }

    async onMessage(ev) {
        const message = ev.data.message;
        const msgEnvelope = JSON.parse(message.body);
        let msg;
        for (const x of msgEnvelope) {
            if (x.version === 1) {
                msg = x;
                break;
            }
        }
        if (!msg) {
            return;
        }

        const dist = await this.resolveTags(msg.distribution.expression);
        const senderUser = (await this.getUsers([msg.sender.userId]))[0];

        const reply = `Hello, ${senderUser.first_name}!`;

        this.msgSender.send({
            distribution: dist,
            threadId: msg.threadId,
            html: `${ reply }`,
            text: reply
        });
    }
}

module.exports = ForstaBot;
