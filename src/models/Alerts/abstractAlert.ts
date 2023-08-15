let alertIdTracker: number = 1

export type AlertId = number

export enum AlertType {
  Error = 'error',
  Info = 'info',
  Warning = 'warning',
}

export interface AbstractAlertData {
  message: string
  type?: AlertType
}

export class AbstractAlert {
  id: AlertId
  type: AlertType
  message: string

  constructor ({ type, message }: AbstractAlertData) {
    this.id = alertIdTracker
    this.type = type || AlertType.Error
    this.message = message || 'Empty message...'

    alertIdTracker = alertIdTracker + 1
  }
}
