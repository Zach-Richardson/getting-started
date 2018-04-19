const relay = require("librelay");

class BotAtlasClient extends relay.AtlasClient {

  static get onboardingCreatedUser() {
    return null; 
  }

  static get userAuthTokenDescription() {
      return 'hello world bot';
  }

  static async onboard(onboardClient) {
    let botUser = await onboardClient.fetch(
      "/v1/user/" + onboardClient.userId + "/"
    );
    const creator = `@${botUser.tag.slug}:${botUser.org.slug}`;
    await relay.storage.putState("onboardUser", botUser.id);
    if (this.onboardingCreatedUser) {
      try {
        botUser = await onboardClient.fetch("/v1/user/", {
          method: "POST",
          json: Object.assign({}, this.onboardingCreatedUser, { user_type: "BOT" })
        });
      } catch (e) {
        throw e;
      }
    }
    const result = await onboardClient.fetch("/v1/userauthtoken/", {
      method: "POST",
      json: { userid: botUser.id, description: this.userAuthTokenDescription }
    });
    await relay.storage.putState("botUser", botUser.id);
    await relay.storage.putState("botUserAuthToken", result.token);

    const atlasClient = await this.factory();

    try {
      const something = await relay.registerDevice({
        name: `Bot (created by ${creator})`,
        atlasClient: atlasClient
      });
      await something.done();
    } catch (e) {
      await relay.registerAccount({
        name: `Bot (created by ${creator})`,
        atlasClient: atlasClient
      });
    }

    return atlasClient;
  }

  static async onboardComplete() {
    return !!await relay.storage.getState("addr");
  }

  static async factory() {
    const userAuthToken = await relay.storage.getState("botUserAuthToken");
    const client = await this.authenticateViaToken(userAuthToken);
    client.maintainJWT(
      false,
      this.authenticateViaToken.bind(this, userAuthToken)
    );
    return client;
  }
}

module.exports = BotAtlasClient;
