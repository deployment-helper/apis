import { handler } from "./createAudioMetaFile.js";

const event = {
  Records: [
    {
      EventSource: "aws:sns",
      EventVersion: "1.0",
      EventSubscriptionArn:
        "arn:aws:sns:ap-south-1:168490963129:generateAudio:e972cabb-3ca6-49d6-979d-6435b251d304",
      Sns: {
        Type: "Notification",
        MessageId: "a3a786fb-13cf-5f2e-8251-db79a02a0726",
        TopicArn: "arn:aws:sns:ap-south-1:168490963129:generateAudio",
        Subject: null,
        Message:
          '{"projectId":"MWVlYzU4NWYtZDM5Ny00ZDJhLWI3OWMtMDNhOGMxYzdiYWJiLTIwMjMtMDktMDFUMTQ6NTM6NDUuMzMxWg==","updatedAt":1693626706468,"updatedAtstr":"2023-09-02T03:51:46.468Z","createdAt":"2023-09-02T03:51:46.468Z","useId":"1eec585f-d397-4d2a-b79c-03a8c1c7babb","id":"75332608-9024-48c4-9526-1664af6e2a7a","s3MetaFile":"","name":"Test1","s3File":"s3://vm-presentations/75332608-9024-48c4-9526-1664af6e2a7a/presentation.json"}',
        Timestamp: "2023-09-18T20:23:01.914Z",
        SignatureVersion: "1",
        Signature:
          "brWhF6XH8MvooahTMyv1h/E0GD8isQWCcnWM5oQaVr54UQ8I/rwSUQqra497KVrx++1K82Gerr+oKOWG6NOy9VQ/GZIGmwetBGbSG0aqQWqqYrWETisbGJKQ8va+CXDGj1jEGn8Wc51lxo3L86YmviOnIPRUkj3hbkLynOMtqj2JDsEoxeiVQzWjcGWZ/NxDAxP2WcAdPnDkbESkgWWCbs7gMMic/FHS5sYXmbbjVdp8fuIkzn1hmM6MXXrZBdhxwQ4ds3pdoxdqd0R+dYTw3Fk4JdEVge14O4RGHNElMeka/eSVBAs46l2YO7oY9S0ax+b38alXDpihOX+KUNoAgw==",
        SigningCertUrl:
          "https://sns.ap-south-1.amazonaws.com/SimpleNotificationService-01d088a6f77103d0fe307c0069e40ed6.pem",
        UnsubscribeUrl:
          "https://sns.ap-south-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:ap-south-1:168490963129:generateAudio:e972cabb-3ca6-49d6-979d-6435b251d304",
        MessageAttributes: {},
      },
    },
  ],
};
handler(event);
