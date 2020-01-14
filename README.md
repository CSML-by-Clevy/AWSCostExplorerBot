# AWSCostExplorerBot

[Medium post](https://medium.com/clevyio/creating-a-simple-aws-cost-explorer-chatbot-with-csml-f8cbf88a265c)  
Explore your AWS costs in any conversational interface easily. Made with the [CSML programming language](https://csml.dev).


## Installation

- Log in to https://studio.csml.dev
- Copy and paste this URL into the "import bot" dialog (or upload a zip of this repository)
- In the `functions` panel, select `cost_explorer` and add your AWS `ACCESS_KEY_ID` and `SECRET_ACCESS_KEY` in the environment variables

## IAM Setup

In order to use this chatbot, you will need a IAM user with sufficient rights to read the cost explorer reports. This would be the minimum rights required for such a user:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "ce:GetCostAndUsage",
                "ce:GetCostForecast"
            ],
            "Resource": "*"
        }
    ]
}
```
