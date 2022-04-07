import { APIGatewayEvent, APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

export abstract class BaseController {
  protected abstract executeImpl (req: APIGatewayProxyEvent): Promise<void | any>;

  public async execute (event: APIGatewayEvent,
                  _context: Context): Promise<APIGatewayProxyResult> {
    try {
      let req = event;
      if (typeof event.body === "string") {
        req.body = JSON.parse(event.body);
      }
      return await this.executeImpl(req);
    } catch (err) {
      return this.fail('An unexpected error occurred')
    }

  }

  public static jsonResponse (code: number, body: string) {
    return {
      statusCode: code,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body,
    };
  }

  public ok<T> (dto?: T) {
    if (!!dto) {
      return BaseController.jsonResponse( 200, JSON.stringify({
        message: dto,
      }));
    } else {
      return BaseController.jsonResponse( 200, JSON.stringify({
        message: `All good ${new Date().toISOString()}`,
      }));
    }
  }

  public conflict (message?: string) {
    return BaseController.jsonResponse( 409, JSON.stringify({
      message: message ? message : 'Conflict',
    }));
  }

  public async fail (error: Error | string) {
    console.log(`Error in ${this.constructor.name}:`, error);
    return BaseController.jsonResponse( 500, JSON.stringify({
      message: error.toString(),
    }));
  }
}