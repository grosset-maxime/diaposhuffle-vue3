import { AbstractAlert } from './abstractAlert'

export interface WarningAlertData {
  message: string
}

export class WarningAlert extends AbstractAlert {
  constructor ({ message }: WarningAlertData) {
    super({ message })
  }
}

export function createWarningAlert (warnData: WarningAlertData) {
  return new WarningAlert(warnData)
}
