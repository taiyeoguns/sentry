from sentry.api.serializers import Serializer, register
from sentry.models import ProcessingIssue


@register(ProcessingIssue)
class ProcessingIssueSerializer(Serializer):
    def get_attrs(self, item_list, user):
        counts = {i.id: getattr(i, "num_events", None) for i in item_list}

        if missing_counts := [
            pk for pk, events in counts.items() if events is None
        ]:
            counts |= dict(
                ProcessingIssue.objects.with_num_events()
                .filter(pk__in=list(missing_counts))
                .values_list("id", "num_events")
            )


        return {item: {"num_events": counts.get(item.id) or 0} for item in item_list}

    def serialize(self, obj, attrs, user):
        return {
            "id": str(obj.id),
            "type": obj.type,
            "checksum": obj.checksum,
            "numEvents": attrs["num_events"],
            "data": obj.data,
            "lastSeen": obj.datetime,
        }
