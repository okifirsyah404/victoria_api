class ParseJSON {
  constructor() {}

  public static parseJSON(body: string): any {
    return JSON.parse(body);
  }

  public static parseJSONAsync(body: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  }

  public static StringifyJSON(body: any): string {
    return JSON.stringify(body);
  }

  public static JSONtoObject(chunk: any): string {
    let body: Array<Uint8Array> = [];

    body.push(chunk);

    return Buffer.concat(body).toString();
  }
}

export default ParseJSON;
