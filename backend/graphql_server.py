"""
GraphQL WebSocket Server Configuration

Sets up GraphQL schema with subscriptions and WebSocket support
"""

import strawberry
from strawberry.fastapi import GraphQLRouter
from strawberry.subscriptions import GRAPHQL_TRANSPORT_WS_PROTOCOL, GRAPHQL_WS_PROTOCOL

from graphql_resolvers import Query, Mutation
from graphql_subscriptions import Subscription


# Create Strawberry schema with Query, Mutation, and Subscription
schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    subscription=Subscription
)


# Create GraphQL router with WebSocket support
graphql_app = GraphQLRouter(
    schema,
    subscription_protocols=[
        GRAPHQL_TRANSPORT_WS_PROTOCOL,  # graphql-ws (Apollo Client 3+)
        GRAPHQL_WS_PROTOCOL              # subscriptions-transport-ws (Legacy)
    ],
    graphiql=True  # Enable GraphiQL playground
)


def get_graphql_router():
    """Get the configured GraphQL router"""
    return graphql_app


__all__ = ['schema', 'graphql_app', 'get_graphql_router']
