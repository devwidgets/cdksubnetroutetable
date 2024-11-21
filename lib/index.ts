// import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface CdksubnetroutetableProps {
  // Define construct properties here
}

export class Cdksubnetroutetable extends Construct {

  constructor(scope: Construct, id: string, props: CdksubnetroutetableProps = {}) {
    super(scope, id);

    // Define construct contents here

    // example resource
    // const queue = new sqs.Queue(this, 'CdksubnetroutetableQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
