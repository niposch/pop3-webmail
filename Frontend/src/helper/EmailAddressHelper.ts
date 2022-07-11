export function extractName(sender: Array<string>): string {
  if (sender.length == 0) {
    return "";
  }
  if(sender.length == 1) {
    return sender[0]
  }
  if(sender[0] == "" || sender[0] == null) {
    return sender[1]
  }
  return sender[0]
}

export function extractEmail(sender: Array<string>): string {

  if (sender == null || sender == undefined || sender.length == 0) {
    return "";
  }
  if (sender.length == 1) {
    return sender[0]
  }
  return sender[1]
}
