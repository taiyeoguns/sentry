from sentry.api.serializers import Serializer, register
from sentry.models.sentryfunction import SentryFunction


@register(SentryFunction)
class SentryFunctionSerializer(Serializer):
    def serialize(self, obj, attrs, user):
        events = list(obj.events)
        env_variables = map(lambda x: {"name": x[0], "value": x[1]}, obj.env_variables.items())
        return {
            "name": obj.name,
            "slug": obj.slug,
            "author": obj.author,
            "code": obj.code,
            "overview": obj.overview,
            "external_id": obj.external_id,
            "events": events,
            "env_variables": env_variables,
        }
