module Generate.Enums exposing (generateFiles)

import Dict
import Elm
import Elm.Gen.Json.Decode as Decode
import Elm.Pattern
import GraphQL.Schema
import String.Extra as String


enumNameToConstructorName =
    String.toSentenceCase


generateFiles : GraphQL.Schema.Schema -> List Elm.File
generateFiles graphQLSchema =
    graphQLSchema.enums
        |> Dict.toList
        |> List.map
            (\( _, enumDefinition ) ->
                let
                    constructors =
                        enumDefinition.values
                            |> List.map .name
                            |> List.map (\name -> ( enumNameToConstructorName name, [] ))

                    enumTypeDeclaration =
                        Elm.customType enumDefinition.name
                            constructors

                    listOfValues =
                        constructors
                            |> List.map (Tuple.first >> Elm.value)
                            |> Elm.list
                            |> Elm.declaration "list"

                    enumDecoder =
                        Elm.declaration "decoder"
                            (Decode.string
                                |> Decode.andThen
                                    (\_ ->
                                        Elm.lambda [ Elm.Pattern.var "string" ]
                                            (Elm.caseOf (Elm.value "string")
                                                ((constructors
                                                    |> List.map
                                                        (\( name, _ ) ->
                                                            ( Elm.Pattern.string name, Decode.succeed (Elm.value name) )
                                                        )
                                                 )
                                                    ++ [ ( Elm.Pattern.wildcard, Decode.fail (Elm.string "Invalid type") ) ]
                                                )
                                            )
                                    )
                            )
                in
                Elm.file (Elm.moduleName [ "TnGql", "Enum", enumDefinition.name ])
                    [ enumTypeDeclaration
                        |> Elm.expose
                    , listOfValues
                        |> Elm.expose
                    , enumDecoder
                    ]
            )