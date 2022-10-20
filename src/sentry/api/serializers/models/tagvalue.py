from sentry.api.serializers import Serializer, serialize
from sentry.models import EventUser
from sentry.search.utils import convert_user_tag_to_query


class EnvironmentTagValueSerializer(Serializer):
    def serialize(self, obj, attrs, user):
        return {"id": str(obj.id), "name": obj.value}


class UserTagValueSerializer(Serializer):
    def __init__(self, project_id):
        self.project_id = project_id

    def get_attrs(self, item_list, user):
        users = EventUser.for_tags(project_id=self.project_id, values=[t.value for t in item_list])

        return {item: {"user": users.get(item.value)} for item in item_list}

    def serialize(self, obj, attrs, user):
        result = serialize(attrs["user"], user) if attrs["user"] else {"id": None}
        if query := convert_user_tag_to_query("user", obj.value):
            result["query"] = query

        result.update(
            {
                "value": obj.value,
                "count": obj.times_seen,
                "lastSeen": obj.last_seen,
                "firstSeen": obj.first_seen,
            }
        )
        return result
