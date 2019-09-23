function doOnExit(exitHandler) {
  //do something when app is closing
  process.on("exit", exitHandler.bind(null));
  //catches ctrl+c event
  process.on("SIGINT", exitHandler.bind(null));
  // catches "kill pid" (for example: nodemon restart)
  process.on("SIGUSR1", exitHandler.bind(null));
  process.on("SIGUSR2", exitHandler.bind(null));
  //catches uncaught exceptions
  // process.on("uncaughtException", exitHandler.bind(null));
}

module.exports = doOnExit;
