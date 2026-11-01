export const wait = (milliseconds = 350) => new Promise<void>(resolve => window.setTimeout(resolve, milliseconds))
