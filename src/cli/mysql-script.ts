export class MysqlScript {

  type: string;
  path: string;
  contents: string;

  constructor(type: string, path: string, contents: string) {
    this.type = type;
    this.path = path;
    this.contents = contents;
  }

}