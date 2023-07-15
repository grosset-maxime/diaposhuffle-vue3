import { AbstractAlert } from './abstractAlert'

export interface InfoAlertData {
  message: string
}

export class InfoAlert extends AbstractAlert {
  constructor ({ message }: InfoAlertData) {
    super({ message })
  }
}

export function createInfoAlert (infoData: InfoAlertData) {
  return new InfoAlert(infoData)
}
