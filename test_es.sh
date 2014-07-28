curl -XGET http://localhost:9200/weiboscope_39_40/tweet/_search?pretty=true -d '
{
    "query" : {
        "match_all" : {}
    },
    "facets" : {
        "histo1" : {
            "date_histogram" : {
                "key_field" : "created_at",
                "interval" : "day"
            }
        }
    }
}'