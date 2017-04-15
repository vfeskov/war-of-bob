War of Bob
-----------

An online game on websocket with highscore tracking on AWS SimpleDB, configured to be deployed on AWS Multi-container Docker EB environment with LetsEncrypt free SSL certificate set up.

Frontend duplicates some of the backend code to minimise network communication, but all the business logic happens on backend, so it should be very hard to cheat.

## License

See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).
