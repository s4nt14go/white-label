import { APIGatewayEvent, APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

export abstract class BaseController {
  protected abstract executeImpl (req: APIGatewayProxyEvent): Promise<void | any>;

  public execute (event: APIGatewayEvent,
                  _context: Context): Promise<APIGatewayProxyResult> {
    try {
      let req = event;
      if (typeof event.body === "string") {
        req.body = JSON.parse(event.body);
      }
      return this.executeImpl(req);
    } catch (err) {
      console.log(`[BaseController]: Uncaught controller error`);
      console.log(err);
      return this.fail('An unexpected error occurred')
    }

  }

  public static jsonResponse (code: number, message: string) {
    return {
      statusCode: code,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: message,
      })
    };
  }

  public ok<T> (dto?: T) {
    if (!!dto) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: dto,
        })
      };
    } else {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: `All good ${new Date().toISOString()}`,
        })
      };
    }
  }

  public conflict (message?: string) {
    return BaseController.jsonResponse( 409, message ? message : 'Conflict');
  }

  public async fail (error: Error | string) {
    console.log(error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: error.toString(),
      })
    };
  }
}