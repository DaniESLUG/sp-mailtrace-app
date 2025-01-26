export const mockMessageDetails = (messageId) => ({
    messageId: messageId,
    timestamp: new Date().toISOString(),
    details: {
        headers: {
            "message-id": `<${messageId}@example.com>`,
            "x-originating-ip": "192.168.1.100",
            "x-ms-exchange-transport-fromentityheader": "Hosted",
            "content-type": "multipart/mixed",
            "x-ms-exchange-organization-authsource": "DM6PR03MB6035.namprd03.prod.outlook.com",
            "x-ms-has-attach": "yes",
            "x-ms-exchange-organization-network-message-id": "d189f8a0-1234-5678-90ab-cd1234567890",
            "x-ms-exchange-organization-scl": "1"
        },
        routing: [
            {
                timestamp: "2024-03-20T10:15:25Z",
                server: "EXCHVS01.internal.com",
                action: "Received",
                details: "from client submission"
            },
            {
                timestamp: "2024-03-20T10:15:26Z",
                server: "EXCHRT02.internal.com",
                action: "Processed",
                details: "message routing"
            },
            {
                timestamp: "2024-03-20T10:15:27Z",
                server: "EXCHSEC01.internal.com",
                action: "Scanned",
                details: "security check completed"
            }
        ],
        size: "234567",
        priority: "normal",
        sensitivity: "none",
        spam_score: "1.2",
        authentication_results: {
            spf: "pass",
            dkim: "pass",
            dmarc: "pass"
        }
    }
}) 