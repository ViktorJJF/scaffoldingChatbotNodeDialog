module.exports = {
    FB_PAGE_TOKEN: 'EAAHGZB9V19FQBADRvAgpid7vYIg9Mh9lH0nxD9rgkZCfxUfAZCYTELMtXZCZAAcZBJfb5G6E60Un0EcYm24BNIemApuTMpWjeVXvGYZC6XDBQsyvBFoVPFffWZAI7TvnMe9y5bUuxEg5JKSN2EMvi4BprCjLudZC0tUsETaeRt6BUzJre7yWkochy',
    FB_VERIFY_TOKEN: 'ujcmtoken',
    API_AI_CLIENT_ACCESS_TOKEN: 'a74c5f54c76c4dda9a64cc662fbcb43a',
    FB_APP_SECRET: 'c1f5af58f3bfec75b27c730b975e80ad',
    FB_APP_ID: '500259897078868',
    SERVER_URL: 'https://smart-ujcm.herokuapp.com/',
    SENDGRID_API_KEY: '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',
    EMAIL_FROM: 'vj.jimenez96@gmail.com',
    ADMIN_ID: process.env.ADMIN_ID,
    EMAIL_TO: 'vj.jimenez96@gmail.com',
    PG_CONFIG: {
        user: process.env.USER_POSTGRESQL,
        database: process.env.DATABASE_POSTGRESQL,
        password: process.env.PASSWORD_POSTGRESQL,
        host: process.env.HOST_POSTGRESQL,
        port: 5432,
        max: 10,
        idleTimeoutMillis: 30000,
    },
};