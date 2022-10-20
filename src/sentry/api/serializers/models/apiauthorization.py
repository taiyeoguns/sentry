from sentry.api.serializers import Serializer, register, serialize
from sentry.models import ApiAuthorization


@register(ApiAuthorization)
class ApiAuthorizationSerializer(Serializer):
    def get_attrs(self, item_list, user):
        apps = {
            d["id"]: d
            for d in serialize({i.application for i in item_list if i.application_id}, user)
        }

        return {
            item: {
                "application": (
                    apps.get(item.application.client_id)
                    if item.application
                    else None
                )
            }
            for item in item_list
        }

    def serialize(self, obj, attrs, user):
        return {
            "id": str(obj.id),
            "scopes": obj.get_scopes(),
            "application": attrs["application"],
            "dateCreated": obj.date_added,
        }
